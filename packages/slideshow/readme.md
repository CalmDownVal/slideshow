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
`component` prop to specify the contents of the slide. This component will
receive a single prop `metadata` which can be used to pass custom data down to
the content component.

By default each slide will be exactly the size of the viewport along the scroll
axis. To change this you can set the `length` prop to any value greater than
zero. 1 indicates viewport size, 2 double the size etc.

Slides can dock to the edge of the viewport. To enable this feature set the
`dock` prop to values greater than zero. When such a slide reaches the docking
edge the slideshow will stop scrolling for the requested length.

### useProgression hook

This hook returns an instance of `Progression` which provides values indicating
the individual phases of a slide. Each value ranges from zero to one
(inclusive).

- **Appear** - from the first pixels of a slide appearing on the screen until it
  reaches its maximum possible visible area.
- **Main** - from the time a slide reaches its maximum visible area to the
  moment its visible area starts decreasing again
- **Disappear** - from the time a slide starts decreasing in visible area to the
  moment it completely disappears from the viewport
- **Dock** - from the start to the end of the docking phase

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

This hook returns an instance of `Navigation` which provides an index of the
currently active slide (the uppermost slide with the largest relative visible
area) and a list of slide metadata. It also provides a `goTo` method which can
be used to scroll to a specific slide programmatically.

## Example

This example shows a super simple slideshow

```tsx
import { Slide, SlideComponentProps, SlideshowProvider, Viewport } from '@calmdownval/slideshow';
import { h } from 'preact';

import '@calmdownval/slideshow/style.css';

const Content = ({ metadata }: SlideComponentProps<string>) => (
  <h2>{metadata}</h2>
);

export const App = () => (
  <SlideshowProvider>
    <Viewport scrollable>
      <Slide component={Content} metadata='First' />
      <Slide component={Content} metadata='Second' />
      <Slide component={Content} metadata='Third' />
    </Viewport>
  </SlideshowProvider>
);
```
