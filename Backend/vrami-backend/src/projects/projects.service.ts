import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto, RouteLocationDto } from './dto/create-project.dto';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RouteSegment {
  from: RouteLocationDto;
  to: RouteLocationDto;
  distanceKm: number;
}

export interface PreviewData {
  pointCount: number;
  totalDistanceKm: number;
  visitedCountriesCount: number;
  center: { lat: number; lng: number } | null;
  segments: RouteSegment[];
}

export interface ProjectEntity {
  id: string;
  name: string;
  description?: string;
  animationType: 'sequential' | 'loop';
  speed: number;
  locations: RouteLocationDto[];
  preview: PreviewData;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ProjectsService {
  private projects: ProjectEntity[] = [];
  private nextId = 1;

  findAll(): ProjectEntity[] {
    return this.projects;
  }

  findOne(id: string): ProjectEntity {
    const project = this.projects.find((item) => item.id === id);
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  create(dto: CreateProjectDto): ProjectEntity {
    const normalizedLocations = this.normalizeLocations(dto.locations ?? []);
    const now = new Date().toISOString();

    const project: ProjectEntity = {
      id: String(this.nextId++),
      name: dto.name,
      description: dto.description ?? '',
      animationType: dto.animationType ?? 'sequential',
      speed: dto.speed ?? 1,
      locations: normalizedLocations,
      preview: this.buildPreview(normalizedLocations),
      createdAt: now,
      updatedAt: now,
    };

    this.projects.push(project);
    return project;
  }

  remove(id: string): { message: string } {
    const index = this.projects.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    this.projects.splice(index, 1);
    return { message: `Project ${id} deleted successfully` };
  }

  private normalizeLocations(
    locations: RouteLocationDto[],
  ): RouteLocationDto[] {
    return locations
      .filter((location) => this.isValidLocation(location))
      .map((location) => ({
        name: location.name,
        country: location.country ?? '',
        lat: Number(location.lat),
        lng: Number(location.lng),
      }));
  }

  private isValidLocation(location: RouteLocationDto | undefined): boolean {
    if (!location) return false;
    const hasName =
      typeof location.name === 'string' && location.name.trim().length > 0;
    const hasLat = Number.isFinite(Number(location.lat));
    const hasLng = Number.isFinite(Number(location.lng));
    return hasName && hasLat && hasLng;
  }

  private buildPreview(locations: RouteLocationDto[]): PreviewData {
    const segments: RouteSegment[] = [];
    let totalDistanceKm = 0;

    for (let index = 0; index < locations.length - 1; index++) {
      const from = locations[index];
      const to = locations[index + 1];
      const distanceKm = this.haversineKm(from.lat, from.lng, to.lat, to.lng);
      totalDistanceKm += distanceKm;
      segments.push({
        from,
        to,
        distanceKm: Number(distanceKm.toFixed(2)),
      });
    }

    const countries = new Set(
      locations
        .map((location) => location.country?.trim())
        .filter((country): country is string => Boolean(country)),
    );

    return {
      pointCount: locations.length,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      visitedCountriesCount: countries.size,
      center: this.calculateCenter(locations),
      segments,
    };
  }

  private calculateCenter(
    locations: RouteLocationDto[],
  ): { lat: number; lng: number } | null {
    if (!locations.length) return null;

    const totals = locations.reduce(
      (accumulator, location) => {
        accumulator.lat += location.lat;
        accumulator.lng += location.lng;
        return accumulator;
      },
      { lat: 0, lng: 0 },
    );

    return {
      lat: Number((totals.lat / locations.length).toFixed(6)),
      lng: Number((totals.lng / locations.length).toFixed(6)),
    };
  }

  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  async processVideo(id: string, file: any) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const inputPath = path.join(uploadsDir, `raw_${id}.webm`);
    const outputPath = path.join(uploadsDir, `final_${id}.mp4`);

    fs.writeFileSync(inputPath, file.buffer);

    try {
      console.log('Convirtiendo a MP4 con FFmpeg...');
      // Comando para que cualquier dispositivo pueda leer el MP4
      await execAsync(
        `ffmpeg -i "${inputPath}" -c:v libx264 -preset slow -crf 18 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -pix_fmt yuv420p -y "${outputPath}"`,
      );

      console.log('✅ ¡Vídeo MP4 generado exitosamente en:', outputPath);
      fs.unlinkSync(inputPath); // Borra el archivo .webm temporal

      return outputPath;
    } catch (error) {
      console.error('Error en FFmpeg:', error);
      throw new Error('Falló la conversión del vídeo');
    }
  }
}
