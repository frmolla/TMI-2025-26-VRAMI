import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asegúrate de que esta ruta coincida con tu Guard

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    // El Guard extrae los datos del token y los pone en req.user
    // Dependiendo de cómo configuraste tu JWT, el ID suele venir en req.user.id o req.user.sub
    const userId = req.user.id || req.user.sub;

    // Usamos el método que ya tienes creado en tu servicio
    const user = await this.usersService.findById(userId);

    // Devolvemos exactamente lo que Angular está esperando
    return {
      email: user.email,
      // Como en tu BD tienes "firstName", lo mandamos como "username".
      // Si no tiene nombre, usamos la primera parte de su correo.
      username: user.firstName || user.email.split('@')[0],
    };
  }
}
