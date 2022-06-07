# Preact Slideshows

A small (~ 10kB) library for scroll slideshows with Preact.

## Installation

Built for Preact v10.

You can install this package using NPM or Yarn. It already contains its own
typings and needs no additional dependencies to use with TypeScript.

```sh
# using NPM
npm install @calmdownval/slideshow

# using Yarn
yarn add @calmdownval/slideshow
```

The package also contains a CSS stylesheet which should be imported into your
application. The easiest way is to add the following import to your index file:

```ts
import '@calmdownval/slideshow/style.css';
```

## Usage

### SlideshowProvider Component

A slideshow must be wrapped in a `<SlideshowProvider>` component. This component
manages the state and layout computations of the entire slideshow.

### Viewport Component

Every slideshow also needs a viewport. It manages a basic DOM structure that
wraps all the slides. It is separated from slideshow provider to allow adding
custom components outside of the viewport and still being able to consume the
slideshow context.

For user-controllable slideshows make sure to set the viewport's `scrollable`
prop to enable scroll bars.

### Slide Components

All that's left is to add some slides into the viewport. Each slide requires a
`content` prop to specify the contents of the slide. The content component will
receive a forwarded `metadata` prop which can be used to pass custom data down
to the content component.

By default each slide will be exactly the size of the viewport along the scroll
axis. To change this you can set the `length` prop to any value greater than
zero. 1 indicates viewport size, 2 double the size etc.

Slides can dock to the edge of the viewport. To enable this feature set the
`dock` prop to values greater than zero. When such a slide reaches the docking
edge the slideshow will stop scrolling for the requested length.

### useProgression hook

This hook returns a progression object with values indicating the individual
phases of a slide. Each value ranges from zero to one (inclusive).

- **main** - from the moment a slide starts entering the screen (0) until it
  leaves the screen entirely (1).
- **dock** - from the start (0) to the end (1) of the docking phase. Always zero
  when dock is not used.
- **enter** - from the moment a slide starts entering the screen (0) until it
  reaches maximum visible area (1).
- **leave** - from the moment a slide starts leaving the screen (0) until it
  leaves entirely (1).

This hook will automatically update your component when any of the values you're
using changes.

Example usage:

```tsx
import { Progression, useProgression } from '@calmdownval/slideshow';
import { h } from 'preact';

export const MyComponent = () => {
  const phase = useProgression();
  return (
    <div
      class='my-component'
      style={Progression.animate('animation-name', phase.main)}
    />
  );
};
```

### useNavigation hook

This hook returns a navigation object which provides an index of the currently
active slide (the uppermost slide with the largest relative visible area) and a
list of all slides. It also provides a `goTo` method which can be used to scroll
to a specific slide programmatically.

This hook will automatically update your component when any of the values you're
using changes.

## Example

This example shows a super simple slideshow

```tsx
import { Slide, SlideContentProps, SlideshowProvider, Viewport } from '@calmdownval/slideshow';
import { h } from 'preact';

import '@calmdownval/slideshow/style.css';

const TestContent = ({ metadata }: SlideContentProps<string>) => (
  <h2>{metadata}</h2>
);

export const App = () => (
  <SlideshowProvider>
    <Viewport scrollable>
      <Slide content={TestContent} metadata='First' />
      <Slide content={TestContent} metadata='Second' />
      <Slide content={TestContent} metadata='Third' />
    </Viewport>
  </SlideshowProvider>
);
```
