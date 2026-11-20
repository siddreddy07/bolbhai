// The shop's product categories, and how products get sorted into them.
// Anything we cannot place becomes "Other".

export const CATEGORIES = ["Cereals", "Dairy", "Drinks", "Snacks", "Cooking", "Fruit & veg", "Ready meals", "Meat & eggs", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

// The catalog's original groups (pnns_groups_1) and the category each one becomes.
export const GROUP_TO_CATEGORY: Record<string, Category> = {
  "Cereals and potatoes": "Cereals",
  "Milk and dairy products": "Dairy",
  "Beverages": "Drinks",
  "Alcoholic beverages": "Drinks",
  "Sugary snacks": "Snacks",
  "Salty snacks": "Snacks",
  "Fat and sauces": "Cooking",
  "Fruits and vegetables": "Fruit & veg",
  "Composite foods": "Ready meals",
  "Fish Meat Eggs": "Meat & eggs",
  "Baby foods": "Other",
};

// First match wins, so the order matters (for example "peanut butter" is checked before "butter").
const RULES: [Category, RegExp][] = [
  ["Ready meals", /\b(noodles?|maggi|pasta|macaroni|spaghetti|instant|ready[ -]to|pizza|burger|sandwich|soups?|biryani|biriyani|khichdi|paratha|samosa|frozen|(idli|dosa|upma|pongal|vada|gulab jamun) mix)\b/],
  ["Meat & eggs", /\b(chicken|mutton|fish|eggs?|prawns?|sausages?|salami|meat|keema|ham)\b/],
  ["Cooking", /\b(peanut butter|jam|honey|spreads?|chutney|pickles?|achar|ketchup|sauces?|mayonnaise|mayo|vinegar|dressing|oils?|ghee|vanaspati|masala|spices?|haldi|turmeric|mirch|chilli|chili|jeera|cumin|dhania|coriander|pepper|elaichi|cardamom|cloves?|cinnamon|hing|asafoetida|ajwain|mustard|rai|salt|sugar|jaggery|gur|tamarind|garam|kasuri|methi|powder)\b/],
  ["Snacks", /\b(biscuits?|cookies?|crackers?|chips?|namkeen|bhujia|sev|mixture|chakli|murukku|popcorn|wafers?|chocolates?|candy|candies|toffees?|toffee|sweets?|mithai|laddu|ladoo|halwa|barfi|burfi|jalebi|rasgulla|soan papdi|cakes?|cupcakes?|brownies?|rusks?|puffs?|nachos|kurkure|makhana|pops|gummies|gummy|lollipops?|bars?|bikis?|marie|rolls?|cream)\b/],
  ["Drinks", /\b(tea|chai|coffee|juices?|drinks?|squash|sharbat|syrup|soda|cola|colas|water|lemonade|nimbu|shake|bournvita|horlicks|boost|complan|beer|wine|whisky|whiskey|vodka|rum|gin|brandy|tonic|energy|kombucha|buttermilk|chaas|lassi|thandai)\b/],
  ["Dairy", /\b(milk|curd|dahi|yogh?urt|paneer|cheese|butter|cream|khoa|mawa|ice cream|kulfi|dairy|malai)\b/],
  ["Fruit & veg", /\b(fruits?|vegetables?|veg|onions?|tomato(es)?|potato(es)?|banana|apple|mango|orange|grapes?|lemon|coconut|peas|corn|almonds?|cashews?|raisins?|dates?|khajoor|walnuts?|pistachios?|peanuts?|groundnuts?|dry fruits?|nuts?|spinach|carrot|cabbage|cauliflower|garlic|ginger|pulp|puree)\b/],
  ["Cereals", /\b(atta|flour|maida|besan|rava|rawa|sooji|suji|semolina|rice|basmati|poha|oats?|muesli|cornflakes|corn flakes|cereals?|dals?|toor|urad|moong|chana|rajma|lentils?|pulses|millets?|ragi|jowar|bajra|quinoa|wheat|vermicelli|seviyan|bread|buns?|murmura|puffed|khichri|grains?)\b/],
];

// Brands that make one kind of thing, for names that are just the brand.
const BRANDS: [Category, RegExp][] = [
  ["Snacks", /\b(haldiram'?s?|bikaji|balaji|lays|kurkure|parle|britannia|sunfeast|cadbury|hershey'?s?|ferrero|nestle munch|bingo|cremica|unibic|good day|monaco|tasties|tasty)\b/],
  ["Dairy", /\b(amul|mother dairy|nandini|aavin|sudha|gokul|sanchi|madhusudan|milky mist|heritage|verka|vijaya)\b/],
  ["Drinks", /\b(tata tea|red label|brooke bond|taj mahal|society tea|tropicana|paper boat|frooti|maaza|slice|bisleri|kinley|aquafina|nescafe|bru|real fruit)\b/],
  ["Cooking", /\b(mdh|everest|catch|pinch|badshah|kissan|tops|dabur honey|saffola|dhara|fortune oil)\b/],
  ["Cereals", /\b(aashirvaad|pillsbury|annapurna|rajdhani|24 mantra|organic tattva)\b/],
];

export function classify(name: string, brand: string | null): Category {
  const text = `${name} ${brand ?? ""}`.toLowerCase();
  for (const [category, pattern] of RULES) if (pattern.test(text)) return category;
  for (const [category, pattern] of BRANDS) if (pattern.test(text)) return category;
  return "Other";
}
