export interface ChartConfigItem {
  label: string
  color: string
}

export interface ChartConfig {
  [key: string]: ChartConfigItem
}

export interface ChartColors {
  [key: string]: string
}
