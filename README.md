# ArtiChart

A modern React 19 chart library for creating beautiful data visualizations.

## Installation

```bash
npm install artichart
# or
yarn add artichart
# or
pnpm add artichart
```

## Usage

```tsx
import { Chart } from 'artichart';
import 'artichart/style.css';

function App() {
  const data = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 200 },
    { label: 'Mar', value: 150 },
    { label: 'Apr', value: 300 },
  ];

  return (
    <Chart
      data={data}
      width={600}
      height={400}
      color="#3b82f6"
      showLabels={true}
    />
  );
}
```

## Props

### Chart

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ChartData[]` | **required** | Array of data points to display |
| `width` | `number` | `400` | Width of the chart in pixels |
| `height` | `number` | `300` | Height of the chart in pixels |
| `color` | `string` | `'#3b82f6'` | Color of the chart bars |
| `showLabels` | `boolean` | `true` | Whether to show labels and values |

### ChartData

```typescript
interface ChartData {
  label: string;
  value: number;
}
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build

# Type check
npm run type-check
```

## License

MIT
