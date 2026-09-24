/**
 * General-interest information for each plant's page: what it is, where it grows,
 * whether it's edible, what people use it for, and any lore.
 *
 * Edibility is deliberately conservative. It is background knowledge, not
 * foraging advice, and the plant page says so.
 */
export type Edibility = 'edible' | 'caution' | 'toxic' | 'inedible';

export interface PlantDetails {
  about: string;
  where: string;
  edibility: Edibility;
  edibilityNote: string;
  uses?: string;
  lore?: string;
}

export const EDIBILITY_LABEL: Record<Edibility, string> = {
  edible: 'Edible',
  caution: 'Edible with care',
  toxic: 'Toxic',
  inedible: 'Not a food plant',
};

export const PLANT_DETAILS: Record<string, PlantDetails> = {
  // Flowers
  peony: {
    about:
      'A long-lived perennial with huge, often fragrant, many-petalled blooms in late spring. It dies back to the ground every winter and returns in spring.',
    where: 'Native to China, Mongolia and eastern Siberia; grown in temperate gardens around the world.',
    edibility: 'caution',
    edibilityNote:
      'Petals are used in some Chinese dishes and teas, but the roots and seeds are mildly toxic, and the plant is harmful to pets.',
    uses: 'The dried root, “bai shao”, has been used in traditional Chinese medicine for over a thousand years.',
    lore: 'Named after Paeon, physician to the Greek gods. When his teacher Asclepius grew jealous, Zeus turned Paeon into a flower to save him.',
  },
  hydrangea: {
    about:
      'A shrub with big mophead or lacecap clusters. The colourful “petals” are mostly sterile sepals that attract insects to the small fertile flowers.',
    where: 'Native to Japan; now a garden staple in mild, moist climates worldwide.',
    edibility: 'toxic',
    edibilityNote: 'Leaves and buds contain cyanogenic compounds that cause stomach upset. Keep away from pets.',
    uses: 'Grown for garden colour, cut flowers and dried flowers.',
    lore: 'In Japan, a sweet tea made from the fermented leaves of a hydrangea variety, amacha, is poured over statues of the Buddha on his birthday.',
  },
  dahlia: {
    about:
      'A tuberous perennial with an astonishing range of flower forms, from tight pompons to “dinner-plate” blooms 30 cm across.',
    where: 'Native to the highlands of Mexico and Central America; grown in gardens worldwide.',
    edibility: 'edible',
    edibilityNote: 'The tubers are edible and were eaten by the Aztecs. Flavour ranges from bland to bitter.',
    uses: 'Tubers as food; flowers for gardens, cut flowers and competitive shows.',
    lore: 'The Aztec name for tree dahlias, acocotli, means “water cane”, after their hollow stems.',
  },
  ranunculus: {
    about:
      'A tuberous plant with tissue-thin petals layered like a rose. It’s one of the most popular spring cut flowers.',
    where: 'Native to the eastern Mediterranean, south-west Asia and north-east Africa.',
    edibility: 'toxic',
    edibilityNote: 'Like all buttercups it contains protoanemonin, which blisters the mouth and irritates skin.',
    uses: 'Cut flowers and bouquets.',
  },
  rose: {
    about:
      'Woody shrubs and climbers with prickly stems and fragrant flowers. There are tens of thousands of cultivated varieties.',
    where: 'Most species are from Asia, with others native to Europe, North America and north-west Africa.',
    edibility: 'edible',
    edibilityNote:
      'Petals and the fruit (rose hips) are edible. Hips are very rich in vitamin C. Avoid flowers sprayed with pesticides.',
    uses: 'Rose water and rose oil (attar) flavour food and scent perfumes and cosmetics. Rose-hip syrup is a traditional vitamin C source.',
    lore: '“Sub rosa”: a rose hung over a meeting once meant that everything said there was secret.',
  },
  tulip: {
    about: 'A spring bulb with cup-shaped flowers. Each bulb normally sends up a single flower.',
    where: 'Wild tulips come from the mountains of Central Asia; they reached Europe through the Ottoman Empire.',
    edibility: 'caution',
    edibilityNote:
      'Bulbs were eaten during the Dutch famine of 1944–45, but they can cause stomach upset and are toxic to pets. The sap can also cause a rash known as “tulip fingers”.',
    uses: 'Gardens, parks and cut flowers; a major export for the Netherlands.',
    lore: 'The name probably comes from the Persian word for turban, which the flower resembles.',
  },
  sunflower: {
    about: 'A fast-growing annual that can reach 3 m. Its giant head is made of hundreds of tiny florets.',
    where: 'Native to North America; now farmed worldwide.',
    edibility: 'edible',
    edibilityNote:
      'The seeds are eaten raw or roasted and pressed for oil. Young flower buds can be cooked like artichokes.',
    uses: 'Seeds, cooking oil and bird food. Sunflowers were also planted to draw contaminants out of soil and water after the Chernobyl disaster.',
    lore: 'Native Americans domesticated the sunflower more than 4,000 years ago, long before maize reached their region.',
  },
  lavender: {
    about: 'An aromatic evergreen shrub with grey-green leaves and slender spikes of purple flowers.',
    where: 'Native to the western Mediterranean. It thrives in sunny, dry, well-drained ground.',
    edibility: 'edible',
    edibilityNote: 'English lavender flowers are used sparingly in baking, teas and herbes de Provence.',
    uses: 'Its oil scents perfumes and soaps. It’s traditionally used to promote calm and sleep.',
    lore: 'The name is often linked to the Latin lavare, “to wash”; Romans scented their baths with it.',
  },
  daisy: {
    about: 'A low perennial of lawns and meadows: white rays around a yellow centre that closes at night and in rain.',
    where: 'Native to Europe; now naturalised in lawns across much of the world.',
    edibility: 'edible',
    edibilityNote: 'Young leaves and flowers can be added to salads.',
    uses: 'An old herbal remedy for bruises, which earned it the name “bruisewort”.',
    lore: 'Children pull daisy petals one by one to learn whether someone “loves me” or “loves me not”.',
  },
  lily: {
    about: 'Bulbs with tall leafy stems and large trumpet-, bowl- or turban-shaped flowers, often intensely scented.',
    where: 'Native across the temperate Northern Hemisphere: Asia, Europe and North America.',
    edibility: 'toxic',
    edibilityNote:
      'Deadly to cats, even in tiny amounts. Bulbs of certain Asian species are eaten in China, but garden lilies should never be eaten.',
    uses: 'Cut flowers and perfume. Dried lily bulb (“baihe”) is used in Chinese cooking and traditional medicine.',
    lore: 'The white Madonna lily symbolises purity in Christian art and often appears in paintings of the Annunciation.',
  },
  iris: {
    about:
      'A perennial with sword-shaped leaves. Each flower has three upright petals (“standards”) and three drooping ones (“falls”).',
    where:
      'The bearded iris is a garden hybrid of Mediterranean origin; wild irises grow across the Northern Hemisphere.',
    edibility: 'toxic',
    edibilityNote: 'The rhizomes and leaves irritate the gut and skin.',
    uses: 'Orris root, the dried rhizome, is used as a fixative in perfumes and as a botanical in gin.',
    lore: 'The fleur-de-lis emblem of the French kings is thought to be a stylised iris.',
  },
  poppy: {
    about:
      'An annual with silky scarlet petals, often with a black blotch at the base. It springs up wherever soil is disturbed.',
    where: 'Native to Europe, North Africa and temperate Asia; it follows farming around the world.',
    edibility: 'caution',
    edibilityNote: 'The seeds are edible, but the rest of the plant is mildly toxic, especially to livestock.',
    uses: 'The petals were once used to colour syrups and in mild traditional cough remedies.',
    lore: 'A symbol of remembrance for fallen soldiers since John McCrae’s 1915 poem “In Flanders Fields”.',
  },
  lotus: {
    about: 'An aquatic plant whose flowers and round leaves rise well above the water on tall stalks.',
    where: 'Native from India to China and south to northern Australia, in ponds and slow rivers.',
    edibility: 'edible',
    edibilityNote: 'The rhizomes (lotus root), seeds and young leaves are eaten throughout Asia.',
    uses: 'The seeds and leaves are used in traditional Chinese and Ayurvedic medicine.',
    lore: 'Sacred in Hinduism and Buddhism as a symbol of purity rising unstained from the mud. A lotus seed about 1,300 years old has been germinated.',
  },
  marigold: {
    about: 'A bushy annual with pompon flowers in orange and gold and a strong, pungent scent.',
    where: 'Native to Mexico and Central America, despite the name “African marigold”.',
    edibility: 'edible',
    edibilityNote: 'The petals are edible and used as a natural colouring.',
    uses: 'An extract of the petals (lutein) is added to poultry feed to deepen egg-yolk colour. It’s also a popular companion plant in vegetable gardens.',
    lore: 'In India, marigold garlands are offered at temples and worn at weddings and festivals.',
  },
  carnation: {
    about: 'A perennial with frilly, clove-scented flowers; one of the world’s most popular cut flowers.',
    where: 'Native to the Mediterranean region.',
    edibility: 'edible',
    edibilityNote: 'Petals are edible once the bitter white base is removed. They were once used to spice wine.',
    uses: 'Cut flowers, and clove-scented oil for perfume.',
    lore: 'The traditional flower of Mother’s Day in the United States and of Parents’ Day in Korea.',
  },
  chrysanthemum: {
    about: 'An autumn-flowering perennial with flowers that range from simple daisies to huge, shaggy globes.',
    where: 'Native to China and north-east Asia; cultivated there for over 2,000 years.',
    edibility: 'edible',
    edibilityNote: 'The flowers of certain varieties are brewed into chrysanthemum tea.',
    uses: 'Chrysanthemum tea is a traditional cooling drink in Chinese medicine.',
    lore: 'In much of Europe, chrysanthemums are placed on graves on All Saints’ Day, so they’re seen as flowers of mourning.',
  },
  lilac: {
    about:
      'A deciduous shrub with dense, cone-shaped clusters of intensely fragrant purple, lilac or white flowers in spring.',
    where: 'Native to the rocky hills of the Balkan Peninsula.',
    edibility: 'edible',
    edibilityNote: 'The flowers are edible though bitter; they’re used to infuse sugar, honey or syrups.',
    uses: 'Mainly ornamental; the scent is recreated in perfumes.',
    lore: 'Walt Whitman mourned Abraham Lincoln in his poem “When Lilacs Last in the Dooryard Bloom’d”.',
  },
  foxglove: {
    about: 'A biennial with tall spikes of drooping tubular bells, speckled inside to guide bees in.',
    where: 'Native to western Europe. It grows in woodland clearings, heaths and hedgerows.',
    edibility: 'toxic',
    edibilityNote: 'Every part is poisonous: its heart-affecting glycosides can be fatal.',
    uses: 'Its compounds became digitalis heart medicines, used only under strict medical supervision.',
    lore: 'Folklore says fairies gave the flowers to foxes to wear as gloves, so they could sneak into henhouses silently.',
  },
  hibiscus: {
    about: 'A tropical shrub with large, trumpet-shaped flowers and a long central column of stamens.',
    where: 'Probably from East Asia. It has been cultivated so long that its wild origin is uncertain.',
    edibility: 'edible',
    edibilityNote:
      'The flowers are used in teas and salads. The famous sour red hibiscus tea usually comes from a relative, roselle.',
    uses: 'In India its crushed flowers were used to shine shoes (hence “shoeflower”) and as a hair treatment.',
    lore: 'It is Malaysia’s national flower, the bunga raya.',
  },
  'bird-of-paradise': {
    about: 'A clump-forming plant with banana-like leaves and flowers shaped like a crested bird’s head.',
    where: 'Native to the coastal bush of South Africa’s Eastern Cape.',
    edibility: 'toxic',
    edibilityNote: 'Mildly toxic: the seeds and flowers can cause nausea and vomiting in people and pets.',
    uses: 'Gardens in warm climates and long-lasting cut flowers.',
    lore: 'It is the official flower of the city of Los Angeles.',
  },
  camellia: {
    about: 'An evergreen shrub with glossy leaves and rose-like flowers in winter and early spring.',
    where: 'Native to Japan, Korea and southern China.',
    edibility: 'edible',
    edibilityNote: 'The seeds are pressed into tsubaki oil, which is used for cooking in Japan.',
    uses: 'Tsubaki oil has been used in Japan for centuries to care for hair and skin.',
    lore: 'Samurai were said to dislike camellias because the whole flower drops at once, like a severed head.',
  },
  gardenia: {
    about: 'An evergreen shrub with glossy leaves and waxy white flowers with a heavy, sweet scent.',
    where: 'Native to southern China, Japan, Taiwan and Vietnam.',
    edibility: 'caution',
    edibilityNote:
      'The fruit is used as a yellow food colouring in East Asia and the flowers scent tea, but the plant is mildly toxic to pets.',
    uses: 'The fruit, zhi zi, is used in traditional Chinese medicine; the scent is prized in perfumery.',
    lore: 'Jazz singer Billie Holiday wore white gardenias in her hair as her signature.',
  },
  anemone: {
    about: 'A tuberous perennial with poppy-like flowers in vivid colours around a dark central boss.',
    where: 'Native to the Mediterranean region, where it carpets hillsides in spring.',
    edibility: 'toxic',
    edibilityNote: 'Contains protoanemonin, which irritates the skin, mouth and gut.',
    uses: 'Cut flowers and spring gardens.',
    lore: 'In Greek myth, anemones sprang from the blood of Adonis, mixed with Aphrodite’s tears, as he died.',
  },
  zinnia: {
    about: 'A heat-loving annual with stiff, long-lasting flowers in almost every colour except blue.',
    where: 'Native to Mexico, in dry grassland and scrub.',
    edibility: 'edible',
    edibilityNote: 'The petals are edible but bitter; best as a colourful garnish.',
    uses: 'Cut flowers and pollinator gardens; a butterfly magnet.',
    lore: 'Named after the German botanist Johann Gottfried Zinn.',
  },
  cosmos: {
    about: 'An airy annual with feathery leaves and daisy-like flowers on long, swaying stems.',
    where: 'Native to Mexico; widely naturalised along roadsides in warm countries.',
    edibility: 'inedible',
    edibilityNote: 'Not grown as food, but not considered toxic.',
    uses: 'Easy cottage-garden and pollinator plant that self-seeds readily.',
    lore: 'In Japan it is called akizakura, “autumn cherry blossom”.',
  },
  snapdragon: {
    about: 'An upright plant with spikes of two-lipped flowers that open like a dragon’s mouth when squeezed.',
    where: 'Native to rocky places around the western Mediterranean.',
    edibility: 'edible',
    edibilityNote: 'The flowers are edible but bitter; use them only as a garnish.',
    uses: 'Cut flowers and bedding. It’s also a classic model plant in genetics research.',
    lore: 'It was once believed to protect against witchcraft and deceit.',
  },
  'sweet-pea': {
    about: 'A climbing annual that clings with tendrils. Its ruffled flowers are intensely fragrant.',
    where: 'Native to Sicily, southern Italy and the Aegean islands.',
    edibility: 'toxic',
    edibilityNote:
      'The seeds and pods are poisonous: eaten in quantity they cause lathyrism, which damages nerves and bones.',
    uses: 'Cut flowers. Sweet peas helped William Bateson and Reginald Punnett discover genetic linkage in the early 1900s.',
    lore: 'In Victorian flower language, sweet peas said “goodbye” or “thank you for a lovely time”.',
  },
  bluebell: {
    about: 'A woodland bulb with nodding, one-sided spikes of violet-blue, scented bells.',
    where: 'Native to Atlantic Europe, especially the ancient woods of Britain and Ireland.',
    edibility: 'toxic',
    edibilityNote: 'All parts contain toxic glycosides, dangerous to people, pets and livestock.',
    uses: 'Its sticky sap was once used as glue for bookbinding and for fixing feathers to arrows.',
    lore: 'Folklore says a ringing bluebell summons the fairies, and that picking one brings bad luck. Wild bluebells are protected by law in the UK.',
  },
  hyacinth: {
    about: 'A spring bulb with a dense spike of waxy, starry flowers and a powerful sweet scent.',
    where: 'Native to the eastern Mediterranean: Turkey, Syria and Lebanon.',
    edibility: 'toxic',
    edibilityNote: 'The bulbs are poisonous and can irritate the skin.',
    uses: 'Spring displays, indoor forcing in glass vases, and perfume.',
    lore: 'In Greek myth, Apollo’s friend Hyacinthus was killed by a discus, and Apollo made this flower grow from his blood.',
  },
  daffodil: {
    about: 'A spring bulb: a central trumpet (corona) surrounded by six petal-like tepals.',
    where: 'Native to western Europe; naturalised in meadows and woods widely.',
    edibility: 'toxic',
    edibilityNote: 'Poisonous. The bulbs are sometimes mistaken for onions, causing serious vomiting.',
    uses: 'Daffodils are grown commercially for galantamine, a medicine used for Alzheimer’s disease.',
    lore: 'The national flower of Wales, worn on St David’s Day (1 March).',
  },
  'calla-lily': {
    about:
      'A clump-forming plant with arrow-shaped leaves and elegant white spathes, each wrapped around a golden spike.',
    where: 'Native to southern Africa, in marshes and along streams.',
    edibility: 'toxic',
    edibilityNote: 'Contains needle-like calcium oxalate crystals that burn the mouth and throat.',
    uses: 'Cut flowers, especially for weddings.',
    lore: 'Georgia O’Keeffe painted calla lilies so often that she was nicknamed “the lady of the lilies”.',
  },
  protea: {
    about: 'A woody shrub whose flower head, up to 30 cm across, is a bowl of pink bracts around a woolly centre.',
    where: 'Native to the fynbos of South Africa’s Western Cape; it needs periodic fire to regenerate.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, though settlers once boiled the nectar of a related protea into a syrup.',
    uses: 'Cut and dried flowers that last for weeks.',
    lore: 'Named after Proteus, the shape-shifting Greek sea god, for the genus’s huge variety of forms.',
  },
  'morning-glory': {
    about: 'A fast-twining annual vine with heart-shaped leaves and funnel-shaped flowers.',
    where: 'Native to Mexico and Central America; naturalised widely in warm regions.',
    edibility: 'toxic',
    edibilityNote: 'The seeds contain hallucinogenic, toxic alkaloids.',
    uses: 'Fences, trellises and quick summer screens.',
    lore: 'Mesoamerican peoples used juice from a related morning glory to process rubber for the balls of their ancient ball game.',
  },
  'forget-me-not': {
    about: 'A small plant with clouds of tiny sky-blue flowers, each with a yellow or white eye.',
    where: 'Native to Europe and Asia, in damp meadows, woods and stream banks.',
    edibility: 'caution',
    edibilityNote:
      'The flowers are sometimes used as a garnish, but the plant contains small amounts of liver-toxic alkaloids.',
    uses: 'Spring bedding and woodland gardens.',
    lore: 'German legend tells of a knight who fell into a river picking these flowers for his lady and cried “Forget me not!” as he was swept away.',
  },
  bougainvillea: {
    about: 'A thorny, vigorous climber smothered in papery bracts of magenta, orange, red or white.',
    where: 'Native to South America, from Brazil to Peru and Argentina.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant. It isn’t seriously toxic, but the thorns and sap can irritate skin.',
    uses: 'Hedges, walls and pergolas in warm climates.',
    lore: 'Named after the explorer Louis-Antoine de Bougainville. It was probably collected by Jeanne Baret, the first woman known to sail around the world.',
  },

  // Houseplants
  monstera: {
    about: 'A climbing aroid with huge glossy leaves that develop splits and holes as the plant matures.',
    where: 'Native to the rainforests of southern Mexico and Central America.',
    edibility: 'caution',
    edibilityNote:
      'The fully ripe fruit is edible. The unripe fruit, leaves and stems contain oxalate crystals that burn the mouth.',
    uses: 'Its fruit is eaten in Central America, and its tough aerial roots have been used to make ropes and baskets.',
  },
  'snake-plant': {
    about: 'Stiff, upright sword-shaped leaves with banded patterns; famously hard to kill.',
    where: 'Native to tropical West Africa, from Nigeria to the Congo.',
    edibility: 'toxic',
    edibilityNote: 'Contains saponins that cause nausea and vomiting; harmful to pets.',
    uses: 'The leaf fibre, known as “bowstring hemp”, was once used to make bowstrings and rope.',
    lore: 'The nickname “mother-in-law’s tongue” comes from its long, sharp-tipped leaves.',
  },
  pothos: {
    about:
      'A trailing vine with heart-shaped leaves, often streaked gold. In the wild it climbs trees, and its leaves grow up to a metre long.',
    where: 'Native to Mo’orea in French Polynesia; now invasive in many tropical forests.',
    edibility: 'toxic',
    edibilityNote: 'Contains calcium oxalate crystals that irritate the mouth; harmful to pets.',
    uses: 'One of the most popular houseplants. It featured in NASA’s 1989 Clean Air Study, though a houseplant’s real effect on room air is small.',
  },
  'fiddle-leaf-fig': {
    about: 'A fig with huge, leathery, violin-shaped leaves; a famously fussy houseplant.',
    where: 'Native to the lowland rainforests of West and Central Africa, where it grows 12–15 m tall.',
    edibility: 'toxic',
    edibilityNote: 'The milky sap irritates skin and the gut; mildly toxic to pets.',
    uses: 'An interior-design favourite; grown outdoors as a shade tree in the tropics.',
  },
  'peace-lily': {
    about: 'Glossy dark leaves and white spathes that last for weeks. It copes well with low light.',
    where: 'Native to the tropical rainforests of Colombia and Venezuela.',
    edibility: 'toxic',
    edibilityNote: 'Contains calcium oxalate crystals that burn the mouth; harmful to pets.',
    uses: 'A popular low-light houseplant and a classic sympathy gift.',
    lore: 'Its white spathe is said to resemble a white flag of truce, which gives it its name.',
  },
  'aloe-vera': {
    about: 'A stemless succulent with thick, serrated leaves full of clear gel.',
    where: 'Probably native to the Arabian Peninsula; now grown throughout the tropics and on windowsills everywhere.',
    edibility: 'caution',
    edibilityNote:
      'The clear inner gel is used in some foods and drinks, but the yellow latex just under the skin is a strong laxative.',
    uses: 'The gel is widely used to soothe sunburn and minor burns, and in cosmetics.',
    lore: 'Ancient Egyptians reportedly called it the “plant of immortality”, and Cleopatra is said to have used it in her beauty routine.',
  },
  'zz-plant': {
    about:
      'Glossy, waxy leaflets on thick stems rising from potato-like rhizomes. Even a single leaflet in soil can grow a new plant.',
    where: 'Native to dry grasslands and forests of eastern Africa, from Kenya to South Africa.',
    edibility: 'toxic',
    edibilityNote: 'All parts contain calcium oxalate; harmful to people and pets if chewed.',
    uses: 'A near-indestructible houseplant for offices and dim rooms.',
  },
  'spider-plant': {
    about: 'Arching, striped leaves and long stems that carry small white flowers and baby plantlets.',
    where: 'Native to tropical and southern Africa.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets; cats often like to nibble it.',
    uses: 'An easy hanging-basket plant that’s simple to propagate from its babies.',
  },
  'rubber-plant': {
    about: 'A fig with big, glossy, dark oval leaves. New leaves unfurl from a red sheath.',
    where: 'Native from north-east India to Indonesia, where it becomes a giant tree.',
    edibility: 'toxic',
    edibilityNote: 'The milky latex irritates skin and the gut; mildly toxic to pets.',
    uses: 'Once tapped for rubber; now a popular houseplant.',
    lore: 'In Meghalaya, India, the Khasi people guide its aerial roots across rivers to grow living root bridges that can last centuries.',
  },
  'chinese-money-plant': {
    about: 'Round, pancake-like leaves on long stalks radiating from a short central stem.',
    where: 'Native to the mountains of Yunnan and Sichuan in southern China.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets.',
    uses: 'The “pass-it-on plant”: its many offsets are easy to share with friends.',
    lore: 'In feng shui, its coin-shaped leaves are thought to attract wealth.',
  },
  'string-of-pearls': {
    about: 'A trailing succulent with pea-shaped leaves strung along thread-like stems.',
    where: 'Native to dry parts of south-western Africa.',
    edibility: 'toxic',
    edibilityNote: 'Mildly toxic to people and pets; it can cause vomiting and skin irritation.',
    uses: 'A favourite for hanging pots and shelves.',
  },
  'boston-fern': {
    about: 'Arching, feathery fronds; a classic hanging-basket plant since Victorian times.',
    where: 'The wild species grows in humid forests and swamps of the tropical Americas and Florida.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets.',
    uses: 'Porches, hanging baskets and bathrooms; it loves humidity.',
    lore: 'The Boston fern began as a chance mutation found in a shipment of ferns in Boston in 1894.',
  },
  'prayer-plant': {
    about: 'A low plant with oval leaves patterned like herringbone, which rise and fold together at night.',
    where: 'Native to the rainforest floor of Brazil.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets.',
    uses: 'A houseplant for humid, shady rooms. Its relative Maranta arundinacea is the source of arrowroot starch.',
  },
  'jade-plant': {
    about: 'A succulent shrub with thick, glossy leaves on woody stems, like a miniature tree.',
    where: 'Native to South Africa and Mozambique.',
    edibility: 'toxic',
    edibilityNote: 'Mildly toxic to cats and dogs; not a food plant.',
    uses: 'A long-lived houseplant, often trained as a bonsai.',
    lore: 'Considered lucky, it’s a traditional housewarming and business-opening gift.',
  },
  'venus-flytrap': {
    about: 'A carnivorous plant with hinged leaf traps fringed with bristles, which snap shut on insects.',
    where:
      'Found in the wild only in the boggy savannas within about 100 km of Wilmington, North Carolina, where it is threatened by poaching.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant.',
    uses: 'Grown by collectors and as a curiosity; it needs rainwater and bright light.',
    lore: 'Charles Darwin called it “one of the most wonderful plants in the world”.',
  },
  'christmas-cactus': {
    about: 'A cactus without spines: flat, segmented stems with tubular flowers at the tips.',
    where: 'Native to the coastal mountain forests of south-eastern Brazil, where it grows on trees and rocks.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets.',
    uses: 'A winter-flowering houseplant. Long nights in autumn trigger its buds.',
    lore: 'Plants can live for decades and are often passed down through families.',
  },
  'african-violet': {
    about: 'A small rosette of fuzzy leaves with violet, pink or white flowers almost all year.',
    where: 'Native to the Eastern Arc mountains of Tanzania and Kenya, where it is now rare in the wild.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets.',
    uses: 'One of the most popular flowering houseplants, with thousands of varieties.',
    lore: 'Its old name, Saintpaulia, honours Baron Walter von Saint Paul, who sent seeds to Germany in 1892.',
  },
  phalaenopsis: {
    about: 'An orchid that grows on trees, with broad leaves, silvery aerial roots and long-lasting sprays of flowers.',
    where: 'Native from South-East Asia to northern Australia.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant, but non-toxic to people and pets.',
    uses: 'One of the world’s best-selling potted plants; one flower spike can bloom for months.',
    lore: 'Its name means “moth-like”. A botanist is said to have mistaken a group of them for moths through his binoculars.',
  },

  // Trees
  oak: {
    about:
      'A long-lived deciduous tree with lobed leaves and acorns sitting in scaly cups. It can live over 1,000 years.',
    where: 'Native from Europe to western Asia, in woods and parkland.',
    edibility: 'caution',
    edibilityNote: 'Acorns are edible only after leaching out their bitter tannins; raw they are harmful.',
    uses: 'Timber for ships, houses and wine barrels. Oak galls were used to make the iron gall ink of old manuscripts.',
    lore: 'Sacred to Zeus, Thor and the druids. Charles II hid in an oak tree, the Royal Oak, while fleeing after a battle in 1651.',
  },
  'sugar-maple': {
    about: 'A deciduous tree with five-lobed leaves that turn blazing orange and red in autumn.',
    where: 'Native to eastern Canada and the north-eastern United States.',
    edibility: 'edible',
    edibilityNote: 'The sap is boiled down into maple syrup and maple sugar.',
    uses: 'Its hard wood is used for furniture, floors, bowling pins and basketball courts.',
    lore: 'A maple leaf is Canada’s national symbol and appears on its flag.',
  },
  'silver-birch': {
    about: 'A slender deciduous tree with white, peeling bark and drooping twigs.',
    where: 'Native across Europe and northern Asia; a pioneer that quickly colonises open land.',
    edibility: 'edible',
    edibilityNote: 'The spring sap is drunk fresh or fermented in northern and eastern Europe.',
    uses: 'Birch-bark tar is humanity’s oldest known glue: Neanderthals made it over 200,000 years ago.',
    lore: 'A tree of new beginnings in Celtic and Slavic folklore; the first letter of the Irish Ogham alphabet, beith, means birch.',
  },
  ginkgo: {
    about: 'A deciduous tree with fan-shaped leaves that all turn butter-yellow and drop within days in autumn.',
    where: 'Native to China; planted as a street tree worldwide because it tolerates pollution.',
    edibility: 'caution',
    edibilityNote:
      'The nuts are eaten roasted in East Asia, but they are toxic raw or in large amounts. The fleshy seed coat smells rancid and irritates skin.',
    uses: 'Its leaf extract is sold as a supplement, though evidence for its benefits is weak.',
    lore: 'Several ginkgos near ground zero in Hiroshima survived the 1945 atomic bomb and are still growing.',
  },
  'weeping-willow': {
    about: 'A graceful tree with long, trailing branches that sweep the ground, usually beside water.',
    where: 'Native to northern China; planted by lakes and rivers around the world.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant.',
    uses: 'Its flexible twigs are woven into baskets. Willow bark was a traditional pain remedy.',
    lore: 'Its Latin name, babylonica, comes from Psalm 137’s willows by the rivers of Babylon, though those trees were probably poplars.',
  },
  baobab: {
    about: 'A massive, bottle-shaped tree that stands leafless for much of the year; it can live for over 1,000 years.',
    where: 'Native to the dry savannas of sub-Saharan Africa.',
    edibility: 'edible',
    edibilityNote: 'The dry, powdery fruit pulp is rich in vitamin C, and the leaves are cooked as a vegetable.',
    uses: 'The bark fibre is made into rope and cloth; hollow trunks have served as shelters and water stores.',
    lore: 'Called the “upside-down tree”: legend says the gods planted it roots-up after it complained.',
  },
  'coast-redwood': {
    about: 'An evergreen conifer with thick, fibrous red bark; the tallest trees on Earth.',
    where: 'Native only to a narrow fog belt along the coast of California and southern Oregon.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant.',
    uses: 'Its decay-resistant timber was heavily logged; only about 5% of the original old-growth forest remains.',
    lore: 'Some living redwoods are over 2,000 years old.',
  },
  olive: {
    about: 'An evergreen tree with silvery-green leaves and a trunk that grows gnarled and twisted with age.',
    where: 'Native to the Mediterranean Basin, in hot, dry summers and mild winters.',
    edibility: 'edible',
    edibilityNote: 'The fruit is too bitter to eat raw; it’s cured before eating or pressed for olive oil.',
    uses: 'Olive oil for cooking, lamps, soap and medicine since ancient times.',
    lore: 'An olive branch symbolises peace. In Greek myth, Athena won Athens by giving its people the first olive tree.',
  },
  jacaranda: {
    about: 'A deciduous tree with fern-like leaves and clouds of purple-blue trumpet flowers.',
    where: 'Native to south-central South America (Bolivia and Argentina); planted in warm cities worldwide.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant.',
    uses: 'A street and park tree for its spectacular spring colour.',
    lore: 'Students in Brisbane say that if a jacaranda flower falls on your head, you’ll pass your exams.',
  },
  'coconut-palm': {
    about: 'A tall palm with a curving trunk and a crown of long feathery fronds.',
    where: 'Found on tropical coasts worldwide; probably native to the Indo-Pacific.',
    edibility: 'edible',
    edibilityNote: 'Coconut water, flesh, milk and oil are all staple foods across the tropics.',
    uses: 'Husk fibre (coir) for rope and mats; leaves for thatch; the trunk for timber.',
    lore: 'Called the “tree of life” in many tropical cultures because every part of it is useful.',
  },
  eucalyptus: {
    about: 'A fast-growing evergreen with aromatic blue-grey leaves and bark that peels in ribbons.',
    where: 'Native to Australia (the blue gum is from Tasmania and Victoria); planted widely elsewhere.',
    edibility: 'toxic',
    edibilityNote: 'Eucalyptus oil is poisonous if swallowed, even in small amounts.',
    uses: 'Its oil is used in decongestant rubs, cough sweets and cleaning products.',
  },
  'horse-chestnut': {
    about: 'A large deciduous tree with hand-shaped leaves and upright “candles” of white flowers in spring.',
    where: 'Native to the mountains of the Balkans; a classic park and avenue tree across Europe.',
    edibility: 'toxic',
    edibilityNote: 'Its conkers are poisonous. Don’t confuse them with edible sweet chestnuts, which have spiny husks.',
    uses: 'An extract of the seeds (aescin) is used in remedies for varicose veins.',
    lore: 'The tree Anne Frank watched from her hiding place in Amsterdam was a horse chestnut.',
  },
  'cherry-blossom': {
    about: 'A flowering cherry grown for its masses of pink or white spring blossom rather than for fruit.',
    where: 'Native to Japan, Korea and China; planted in parks around the world.',
    edibility: 'edible',
    edibilityNote: 'The blossoms and leaves are salt-pickled for sakura tea and sweets like sakura mochi.',
    uses: 'Ornamental; the whole country of Japan celebrates hanami, blossom-viewing parties.',
    lore: 'In 1912 Tokyo gave Washington, D.C. about 3,000 cherry trees as a gift of friendship.',
  },
  magnolia: {
    about: 'An evergreen tree with glossy leathery leaves, rusty beneath, and huge, creamy, lemon-scented flowers.',
    where: 'Native to the south-eastern United States.',
    edibility: 'inedible',
    edibilityNote: 'Not a food plant.',
    uses: 'A shade and ornamental tree; its big leaves are used in wreaths.',
    lore: 'The state flower of Mississippi and Louisiana, and a symbol of the American South.',
  },
  wisteria: {
    about: 'A woody climber with long hanging clusters of fragrant lilac flowers in spring.',
    where: 'Native to China; grown on walls and pergolas worldwide.',
    edibility: 'toxic',
    edibilityNote: 'The seeds and pods are poisonous, especially to children and pets.',
    uses: 'Pergolas, arches and house walls.',
    lore: 'In Japan, a wisteria in Ashikaga Flower Park is more than 150 years old and is held up by a huge trellis.',
  },
  dogwood: {
    about: 'A small tree with layered branches, big white spring “flowers” and red berries in autumn.',
    where: 'Native to eastern North America, in woodland edges.',
    edibility: 'caution',
    edibilityNote: 'The berries are eaten by birds but are bitter and mildly toxic to people.',
    uses: 'Its very hard wood was used for loom shuttles and golf-club heads.',
    lore: 'A Christian legend says Jesus’s cross was made of dogwood, and that its four bracts form a cross.',
  },
  'scots-pine': {
    about: 'A tall conifer with blue-green needles in pairs and flaky orange bark on its upper trunk.',
    where: 'Native from Scotland and Spain across Europe to eastern Siberia.',
    edibility: 'caution',
    edibilityNote:
      'The needles make a vitamin-C-rich tea, and the inner bark was ground into famine bread in Scandinavia. Don’t confuse it with toxic yew.',
    uses: 'Timber, pine tar and turpentine.',
    lore: 'Scotland’s national tree and a remnant of the ancient Caledonian Forest.',
  },
};
