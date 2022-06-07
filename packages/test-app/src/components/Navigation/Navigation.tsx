import { bem, useNavigation } from '@calmdownval/slideshow';
import { h } from 'preact';

import type { SlideMetadata } from '~/types';

import './Navigation.css';

export const Navigation = () => {
	const nav = useNavigation<SlideMetadata>();
	return (
		<ul class='navigation'>
			{nav.slides.map((slide, index) => (
				<li
					key={index}
					class={bem('navigation__item', { active: index === nav.activeIndex })}
				>
					<a
						class='navigation__button'
						onClick={() => nav.goTo(index)}
						type='button'
					>
						{slide.metadata.title}
					</a>
				</li>
			))}
		</ul>
	);
};
