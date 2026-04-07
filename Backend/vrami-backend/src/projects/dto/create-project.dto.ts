export class RouteLocationDto {
  name!: string;
  country?: string;
  lat!: number;
  lng!: number;
}

export class CreateProjectDto {
  name!: string;
  description?: string;
  animationType?: 'sequential' | 'loop';
  speed?: number;
  locations!: RouteLocationDto[];
}
