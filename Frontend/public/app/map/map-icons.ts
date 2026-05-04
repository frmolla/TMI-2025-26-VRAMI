import { IPoints } from "./models/points.model";

export const mapIcons = {
  marker: (point: IPoints) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill="${point.status === 'active' ? '#2563eb' : '#EF4444'}"
      />
      <text 
        x="12" 
        y="12" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-size="9"
        fill="white"
        font-family="Arial"
        font-weight="bold">
        ${point.orden}
      </text>
    </svg>
  `
};