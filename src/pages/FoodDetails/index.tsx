import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  category: number;
  formattedPrice: string;
  extras: Extra[];
}

interface FavoriteFood {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  extras?: Extra[];
}

interface OrderFood {
  quantity: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  thumbnail_url: string;
  category: number;
  extras?: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const foodsResponse = await api.get<Food>(`/foods/${routeParams.id}`);

      if (foodsResponse) {
        setFood({
          ...foodsResponse.data,
          formattedPrice: formatValue(foodsResponse.data.price),
        });

        const foodExtras = foodsResponse.data.extras.map(extra => ({
          ...extra,
          quantity: 0,
        }));

        setExtras(foodExtras);
      }

      try {
        const favoritesResponse = await api.get<FavoriteFood>(
          `/favorites/${routeParams.id}`,
        );

        if (favoritesResponse) {
          const favoriteExists = favoritesResponse.data;
          setIsFavorite(!!favoriteExists);
        }
      } catch (err) {
        console.log(err);
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extrasCopy = extras.slice();
    const extraToIncrementIndex = extrasCopy.findIndex(
      extra => extra.id === id,
    );
    extrasCopy[extraToIncrementIndex].quantity += 1;

    setExtras(extrasCopy);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extrasCopy = extras.slice();
    const extraToDecrementIndex = extrasCopy.findIndex(
      extra => extra.id === id,
    );

    if (extrasCopy[extraToDecrementIndex].quantity > 0) {
      extrasCopy[extraToDecrementIndex].quantity -= 1;
    }

    setExtras(extrasCopy);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(foodQuantity > 1 ? foodQuantity - 1 : 1);
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (isFavorite) {
      await api.delete(`favorites/${food.id}`);
    } else {
      const newFavorite: FavoriteFood = { ...food };
      delete newFavorite.extras;

      await api.post('favorites', newFavorite);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    if (!food) return formatValue(0);

    const foodTotal = food.price * foodQuantity;
    const extrasTotal = extras.reduce((total, extra) => {
      return total + extra.value * extra.quantity;
    }, 0);

    return formatValue(foodTotal + extrasTotal);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    if (!food) return;

    const orderExtras = extras.filter(extra => extra.quantity > 0);

    const order: OrderFood = {
      product_id: food.id,
      description: food.description,
      thumbnail_url: food.thumbnail_url,
      name: food.name,
      category: food.category,
      price: food.price,
      quantity: foodQuantity,
      ...(orderExtras.length > 0
        ? {
            extras: orderExtras,
          }
        : {}),
    };

    await api.post('orders', order);

    navigation.navigate('MainBottom');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
