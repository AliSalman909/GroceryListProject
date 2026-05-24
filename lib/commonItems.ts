export type CommonCategory = {
  name: string;
  emoji: string;
  items: string[];
};

export const COMMON_CATEGORIES: CommonCategory[] = [
  {
    name: 'Dairy',
    emoji: '🥛',
    items: ['Milk', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Cream', 'Labneh'],
  },
  {
    name: 'Produce',
    emoji: '🥦',
    items: ['Tomatoes', 'Onions', 'Garlic', 'Potatoes', 'Carrots', 'Lettuce', 'Cucumber', 'Bell peppers', 'Lemons', 'Bananas', 'Apples'],
  },
  {
    name: 'Meat',
    emoji: '🥩',
    items: ['Chicken breast', 'Ground beef', 'Lamb', 'Sausages', 'Tuna cans', 'Salmon'],
  },
  {
    name: 'Bakery',
    emoji: '🍞',
    items: ['Bread', 'Pita bread', 'Croissants', 'Flatbread'],
  },
  {
    name: 'Pantry',
    emoji: '🫙',
    items: ['Rice', 'Pasta', 'Olive oil', 'Salt', 'Sugar', 'Flour', 'Tomato paste', 'Lentils', 'Chickpeas', 'Honey'],
  },
  {
    name: 'Drinks',
    emoji: '🧃',
    items: ['Water bottles', 'Juice', 'Tea', 'Coffee', 'Soft drinks'],
  },
  {
    name: 'Snacks',
    emoji: '🍿',
    items: ['Chips', 'Biscuits', 'Nuts', 'Chocolate', 'Crackers'],
  },
  {
    name: 'Household',
    emoji: '🧴',
    items: ['Dish soap', 'Laundry detergent', 'Trash bags', 'Tissues', 'Shampoo', 'Toothpaste'],
  },
];
