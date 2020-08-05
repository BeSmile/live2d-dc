import React from 'react'

import styles from './index.css';

function BasicLayout(props) {
  return (
    <div className={styles.layout}>
      {props.children}
    </div>
  );
}

export default BasicLayout;
