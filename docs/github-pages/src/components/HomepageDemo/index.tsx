import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

export default function HomepageDemo() {
  return (
    <section className={styles.demoSection}>
      <div className="container">
        <div className={clsx('row', styles.demoRow)}>
          <div className={clsx('col col--6', styles.demoTextCol)}>
            <Heading as="h2">Easily write your CV</Heading>
            <p>
              Don't waste any more time formatting your CV. With CV Wonder, you can focus entirely on your content
              while our powerful engine handles all the layout and styling details. From beautiful typography to
              perfect spacing, we've got you covered.
            </p>
            <p>
              Simply provide your information in a simple YAML format, choose a theme, and let CV Wonder transform
              it into a professional CV in seconds.
            </p>
            <Heading as="h2">Love the instant render</Heading>
            <p>
              Experience the magic of instant rendering with CV Wonder. As you type, your CV is updated in real-time,
              allowing you to see exactly how your changes will look. No more guesswork or tedious back-and-forth
              between editing and previewing.
            </p>
            <p>
              With CV Wonder, you can make adjustments on the fly and see the results immediately.
            </p>
          </div>
          <div className={clsx('col col--6', styles.demoImageCol)}>
            <div className={styles.cvPreviewWrapper}>
              {/* Replace this with an actual screenshot of a CV generated with CV Wonder */}
              <div className={styles.cvPreviewPlaceholder}>
                <img
                  src={require('@site/static/img/theme-default-w800px.png').default}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
