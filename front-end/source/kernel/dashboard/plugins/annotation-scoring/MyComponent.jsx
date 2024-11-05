import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

const MyComponent = () => {
  const [value, setValue] = useState(30);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <div style={{ width: 300, margin: '50px auto' }}>
      <Typography gutterBottom>Value: {value}</Typography>
      <Slider value={value} onChange={handleChange} aria-labelledby="continuous-slider" />
    </div>
  );};

export default MyComponent;
