import { Box } from '@mui/material';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

import { colorTokens } from '../design/tokens';
import type { ChartPoint } from '../../types/api';

export const DEFAULT_CHART_COLORS = [
  colorTokens.primary,
  colorTokens.success,
  colorTokens.warning,
  colorTokens.info,
  colorTokens.danger,
  colorTokens.muted,
];

export const CHART_COLOR_BY_LABEL: Record<string, string> = {
  Draft: colorTokens.subtleText,
  Active: colorTokens.success,
  Closed: colorTokens.warning,
  Published: colorTokens.primary,
  Archived: colorTokens.subtleText,
  Hidden: colorTokens.muted,
  Unpublished: colorTokens.muted,
  ActivePlayer: colorTokens.primary,
  Inactive: colorTokens.danger,
};

type D3ChartType = 'bar' | 'line' | 'donut';

interface D3ChartProps {
  data: ChartPoint[];
  type: D3ChartType;
  height?: number;
  compact?: boolean;
  colorByLabel?: Record<string, string>;
}

function displayLabel(label: string) {
  return label === 'ActivePlayer' ? 'Active' : label;
}

function getColor(label: string, index: number, colorByLabel?: Record<string, string>) {
  return colorByLabel?.[label] ?? CHART_COLOR_BY_LABEL[label] ?? DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];
}

export function D3Chart({ data, type, height = 240, compact = false, colorByLabel }: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = compact ? 320 : 680;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (data.length === 0) return;

    if (type === 'donut') {
      const radius = Math.min(width, height) / 2 - (compact ? 12 : 18);
      const innerRadius = radius * 0.62;
      const group = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);
      const pie = d3
        .pie<ChartPoint>()
        .value((datum) => datum.value)
        .sort(null)
        .padAngle(0.035);
      const arc = d3.arc<d3.PieArcDatum<ChartPoint>>().innerRadius(innerRadius).outerRadius(radius).cornerRadius(3);
      const labelArc = d3.arc<d3.PieArcDatum<ChartPoint>>().innerRadius(radius + 12).outerRadius(radius + 12);

      group
        .selectAll('path')
        .data(pie(data))
        .join('path')
        .attr('d', arc)
        .attr('fill', (datum, index) => getColor(datum.data.label, index, colorByLabel))
        .attr('stroke', colorTokens.surface)
        .attr('stroke-width', 3)
        .append('title')
        .text((datum) => `${displayLabel(datum.data.label)}: ${datum.data.value}`);

      if (!compact) {
        group
          .selectAll('text')
          .data(pie(data).filter((datum) => datum.endAngle - datum.startAngle > 0.28))
          .join('text')
          .attr('transform', (datum) => `translate(${labelArc.centroid(datum)})`)
          .attr('text-anchor', 'middle')
          .attr('font-size', 11)
          .attr('font-weight', 800)
          .attr('fill', colorTokens.axisText)
          .text((datum) => displayLabel(datum.data.label));
      }
      return;
    }

    const margin = compact
      ? { top: 10, right: 12, bottom: 34, left: 34 }
      : { top: 18, right: 24, bottom: 46, left: 46 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const maxValue = Math.max(...data.map((datum) => datum.value), 1);
    const y = d3.scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0]);

    chart
      .append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(compact ? 3 : 5).tickSize(-innerWidth).tickFormat(() => ''))
      .call((axis) => axis.select('.domain').remove())
      .call((axis) => axis.selectAll('line').attr('stroke', colorTokens.gridLine).attr('stroke-dasharray', '3 3'));

    chart
      .append('g')
      .call(d3.axisLeft(y).ticks(compact ? 3 : 5).tickFormat(d3.format('~s')))
      .call((axis) => axis.select('.domain').attr('stroke', colorTokens.axisLine))
      .call((axis) => axis.selectAll('text').attr('font-size', 10).attr('fill', colorTokens.muted));

    if (type === 'bar') {
      const x = d3
        .scaleBand()
        .domain(data.map((datum) => datum.label))
        .range([0, innerWidth])
        .padding(0.22);

      chart
        .append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat((label) => displayLabel(String(label))))
        .call((axis) => axis.select('.domain').attr('stroke', colorTokens.axisLine))
        .call((axis) =>
          axis.selectAll('text').attr('font-size', compact ? 9 : 10).attr('fill', colorTokens.axisText),
        );

      chart
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (datum) => x(datum.label) ?? 0)
        .attr('y', (datum) => y(datum.value))
        .attr('width', x.bandwidth())
        .attr('height', (datum) => innerHeight - y(datum.value))
        .attr('rx', 6)
        .attr('fill', (datum, index) => getColor(datum.label, index, colorByLabel))
        .append('title')
        .text((datum) => `${displayLabel(datum.label)}: ${datum.value}`);
      return;
    }

    const x = d3
      .scalePoint()
      .domain(data.map((datum) => datum.label))
      .range([0, innerWidth])
      .padding(0.35);
    const line = d3
      .line<ChartPoint>()
      .x((datum) => x(datum.label) ?? 0)
      .y((datum) => y(datum.value))
      .curve(d3.curveMonotoneX);

    chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat((label) => displayLabel(String(label))))
      .call((axis) => axis.select('.domain').attr('stroke', colorTokens.axisLine))
      .call((axis) =>
        axis.selectAll('text').attr('font-size', compact ? 9 : 10).attr('fill', colorTokens.axisText),
      );

    chart
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', colorTokens.chartLine)
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line);

    chart
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (datum) => x(datum.label) ?? 0)
      .attr('cy', (datum) => y(datum.value))
      .attr('r', compact ? 4 : 5)
      .attr('fill', colorTokens.chartLine)
      .attr('stroke', colorTokens.surface)
      .attr('stroke-width', 2)
      .append('title')
      .text((datum) => `${displayLabel(datum.label)}: ${datum.value}`);
  }, [colorByLabel, compact, data, height, type, width]);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box component="svg" ref={svgRef} sx={{ display: 'block', width: '100%', height }} />
    </Box>
  );
}
