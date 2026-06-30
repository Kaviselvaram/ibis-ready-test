import React from 'react';
import { ShamayimToggleSwitch } from './switch';

export default function RockerSwitch({ checked, onChange }) {
  return (
    <ShamayimToggleSwitch
      defaultState={checked}
      onChange={onChange}
    />
  );
}

