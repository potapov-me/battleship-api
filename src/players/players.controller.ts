import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { 
  CreatePlayerDto, 
  UpdatePlayerDto, 
  PlayerResponseDto, 
  PlayerStatsDto, 
  PlayerListResponseDto 
} from './dto/player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Игроки')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового игрока' })
  @ApiResponse({ 
    status: 201, 
    description: 'Игрок успешно создан', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Username или email уже используется' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Ошибка валидации данных' 
  })
  @HttpCode(HttpStatus.CREATED)
  async createPlayer(@Body() createPlayerDto: CreatePlayerDto): Promise<PlayerResponseDto> {
    return this.playersService.createPlayer(createPlayerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех игроков' })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Номер страницы', 
    type: Number 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Количество игроков на странице', 
    type: Number 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Поиск по username или email' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список игроков получен', 
    type: PlayerListResponseDto 
  })
  async findAllPlayers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<PlayerListResponseDto> {
    return this.playersService.findAllPlayers(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить игрока по ID' })
  @ApiParam({ name: 'id', description: 'ID игрока' })
  @ApiResponse({ 
    status: 200, 
    description: 'Игрок найден', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Игрок не найден' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Неверный формат ID' 
  })
  async findPlayerById(@Param('id') id: string): Promise<PlayerResponseDto> {
    return this.playersService.findPlayerById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Получить игрока по username' })
  @ApiParam({ name: 'username', description: 'Username игрока' })
  @ApiResponse({ 
    status: 200, 
    description: 'Игрок найден', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Игрок не найден' 
  })
  async findPlayerByUsername(@Param('username') username: string): Promise<PlayerResponseDto> {
    return this.playersService.findPlayerByUsername(username);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Получить игрока по email' })
  @ApiParam({ name: 'email', description: 'Email игрока' })
  @ApiResponse({ 
    status: 200, 
    description: 'Игрок найден', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Игрок не найден' 
  })
  async findPlayerByEmail(@Param('email') email: string): Promise<PlayerResponseDto> {
    return this.playersService.findPlayerByEmail(email);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить данные игрока' })
  @ApiParam({ name: 'id', description: 'ID игрока' })
  @ApiResponse({ 
    status: 200, 
    description: 'Данные игрока обновлены', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Игрок не найден' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Username или email уже используется' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Ошибка валидации данных' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован' 
  })
  async updatePlayer(
    @Param('id') id: string,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ): Promise<PlayerResponseDto> {
    return this.playersService.updatePlayer(id, updatePlayerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить игрока' })
  @ApiParam({ name: 'id', description: 'ID игрока' })
  @ApiResponse({ 
    status: 204, 
    description: 'Игрок успешно удален' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Игрок не найден' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Неверный формат ID' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован' 
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlayer(@Param('id') id: string): Promise<void> {
    return this.playersService.deletePlayer(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику игрока' })
  @ApiParam({ name: 'id', description: 'ID игрока' })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика игрока получена', 
    type: PlayerStatsDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Игрок не найден' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Неверный формат ID' 
  })
  async getPlayerStats(@Param('id') id: string): Promise<PlayerStatsDto> {
    return this.playersService.getPlayerStats(id);
  }

  @Post('confirm-email')
  @ApiOperation({ summary: 'Подтвердить email игрока' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Токен подтверждения email'
        }
      },
      required: ['token']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email успешно подтвержден' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Неверный или просроченный токен' 
  })
  async confirmEmail(@Body('token') token: string): Promise<{ message: string }> {
    await this.playersService.confirmEmail(token);
    return { message: 'Email успешно подтвержден' };
  }

  @Post('resend-confirmation')
  @ApiOperation({ summary: 'Отправить повторное письмо подтверждения' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email игрока'
        }
      },
      required: ['email']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Токен подтверждения сгенерирован' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Пользователь не найден' 
  })
  async resendConfirmation(@Body('email') email: string): Promise<{ message: string }> {
    const token = await this.playersService.generateEmailConfirmationToken(email);
    // TODO: Отправить email с токеном
    return { message: 'Токен подтверждения сгенерирован' };
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ 
    status: 200, 
    description: 'Профиль получен', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован' 
  })
  async getMyProfile(@Request() req): Promise<PlayerResponseDto> {
    return this.playersService.findPlayerById(req.user.id);
  }

  @Put('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiResponse({ 
    status: 200, 
    description: 'Профиль обновлен', 
    type: PlayerResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Username или email уже используется' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Ошибка валидации данных' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Не авторизован' 
  })
  async updateMyProfile(
    @Request() req,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ): Promise<PlayerResponseDto> {
    return this.playersService.updatePlayer(req.user.id, updatePlayerDto);
  }
}
