# Preact Presentations

A small (~ 10kB) library for scroll presentations with Preact.

## Installation

Built for Preact v10.

You can install this package using NPM or Yarn. It already contains its own
typings and needs no additional dependencies to use with TypeScript.

```sh
# using NPM
npm install @calmdownval/presentation

# using Yarn
yarn add @calmdownval/presentation
```

The package also contains a CSS stylesheet which should be imported into your
application. The easiest way is to add the following import to your index file:

```ts
import '@calmdownval/presentation/style.css';
```

## Usage

### Presentation Component

To build a presentation start by picking a suitable presentation component.
Currently there are two options:

- `ScrollPresentation` - for presentations with visible sliders the user can
  control themselves
- `ManualPresentation` - exposes a `position` prop which you can use to control
  the presentation from code

You can also extend the abstract `PresentationBase` class to implement your own
logic.

### Viewport Component

Every presentation needs a viewport. This creates an element that will wrap all
the slides. It is separated from presentation to allow adding extra components
outside of the viewport while still being able to consume the navigation
context.

For user-controllable presentations make sure to set the viewport's `scrollable`
prop to explicitly enable scroll bars.

### Slide Components

All that's left is to add a bunch of slides into the viewport. Each slide
requires a `component` prop to specify the contents of the slide. This component
will receive a single prop `metadata` which can be used to pass custom data down
to the content component.

By default each slide will be exactly the size of the viewport along the scroll
axis. To change this you can set the `length` prop to any value greater than
zero. 1 indicates viewport size, 2 double the size etc.

Slides can dock to the lower edge of the viewport (numerically speaking, i.e.
top for vertical or left for horizontal presentations). To enable this feature
set the `dock` property to values greater than zero. When such a slide reaches
the docking edge the presentation will stop scrolling for the requested length.

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
import { Progression, useProgression } from '@calmdownval/presentation';
import { h } from 'preact';

export const MyComponent = () => {
  const phase = useProgression();
  return (
    <div
      className='my-component'
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

This example shows a super simple presentation

```tsx
import { ScrollPresentation, Slide, SlideComponentProps, Viewport } from '@calmdownval/presentation';
import { h } from 'preact';

import '@calmdownval/presentation/style.css';

const Content = ({ metadata }: SlideComponentProps<string>) => (
  <h2>{metadata}</h2>
);

export const App = () => (
  <ScrollPresentation>
    <Viewport scrollable>
      <Slide component={Content} metadata='First' />
      <Slide component={Content} metadata='Second' />
      <Slide component={Content} metadata='Third' />
    </Viewport>
  </ScrollPresentation>
);
```
