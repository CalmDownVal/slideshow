import { bem, useNavigation } from '@calmdownval/slideshow';
import { h } from 'preact';

import './Navigation.css';

export function Navigation() {
	const nav = useNavigation<string>();
	return (
		<ul class='navigation'>
			{nav.slides.map((slide, index) => (
				<li
					key={index}
					class={bem('navigation__item', { active: index === nav.activeIndex })}
				>
					<a
						class='navigation__button'
						// onClick={() => nav.goTo(index)}
						type='button'
					>
						{slide.metadata}
					</a>
				</li>
			))}
		</ul>
	);
}
