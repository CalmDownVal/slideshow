import { bem, useNavigation } from '@calmdownval/presentation';
import React from 'react';

import './Navigation.css';

export function Navigation() {
	const nav = useNavigation<string>();
	return (
		<ul className='navigation'>
			{nav.slides.map(({ metadata }, index) => (
				<li
					key={index}
					className={bem('navigation__item', { active: index === nav.activeIndex })}
				>
					<a
						className='navigation__button'
						onClick={() => nav.goTo(index)}
						type='button'
					>
						{metadata}
					</a>
				</li>
			))}
		</ul>
	);
}
