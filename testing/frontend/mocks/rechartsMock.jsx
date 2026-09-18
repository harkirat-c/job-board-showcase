import React from 'react';

const withDisplayName = (name, renderChildren = false) => {
  const Component = ({ children }) => (
    <div data-testid={`mock-${name}`}>
      {renderChildren ? children : null}
    </div>
  );
  Component.displayName = name;
  return Component;
};

export const ResponsiveContainer = withDisplayName('ResponsiveContainer', true);
export const BarChart = withDisplayName('BarChart', true);
export const LineChart = withDisplayName('LineChart', true);
export const CartesianGrid = withDisplayName('CartesianGrid');
export const XAxis = withDisplayName('XAxis');
export const YAxis = withDisplayName('YAxis');
export const Tooltip = withDisplayName('Tooltip');
export const Legend = withDisplayName('Legend');
export const Bar = withDisplayName('Bar');
export const Line = withDisplayName('Line');
