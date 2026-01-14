const Typography = {
  sizes: {
    hero: 36,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    medium: 15,
    caption: 14,
    small: 12,
    tiny: 10,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export default Typography;
