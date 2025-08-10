import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { 
  CreatePlayerDto, 
  UpdatePlayerDto, 
  PlayerResponseDto, 
  PlayerStatsDto, 
  PlayerListResponseDto,
  PlayerSearchDto 
} from './dto/player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createPlayer(createPlayerDto: CreatePlayerDto): Promise<PlayerResponseDto> {
    const { username, email, password, roles = ['player'], bio, avatar } = createPlayerDto;

    // Проверяем уникальность username и email
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username уже используется');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email уже используется');
      }
    }

    // Хешируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем нового пользователя
    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      roles,
      bio,
      avatar,
      isEmailConfirmed: false,
      isActive: true,
      rating: 1000,
      totalGames: 0,
      wins: 0,
      losses: 0,
    });

    const savedUser = await newUser.save();
    return this.mapToPlayerResponse(savedUser);
  }

  async findAllPlayers(
    page: number = 1, 
    limit: number = 10, 
    searchParams?: PlayerSearchDto
  ): Promise<PlayerListResponseDto> {
    const skip = (page - 1) * limit;
    
    // Строим запрос
    const query: any = {};
    
    if (searchParams?.search) {
      query.$or = [
        { username: { $regex: searchParams.search, $options: 'i' } },
        { email: { $regex: searchParams.search, $options: 'i' } }
      ];
    }

    if (searchParams?.minRating !== undefined) {
      query.rating = { $gte: searchParams.minRating };
    }

    if (searchParams?.maxRating !== undefined) {
      if (query.rating) {
        query.rating.$lte = searchParams.maxRating;
      } else {
        query.rating = { $lte: searchParams.maxRating };
      }
    }

    if (searchParams?.isEmailConfirmed !== undefined) {
      query.isEmailConfirmed = searchParams.isEmailConfirmed;
    }

    if (searchParams?.isActive !== undefined) {
      query.isActive = searchParams.isActive;
    }

    // Сортировка
    const sortOptions: any = {};
    if (searchParams?.sortBy) {
      const sortOrder = searchParams.sortOrder === 'asc' ? 1 : -1;
      sortOptions[searchParams.sortBy] = sortOrder;
    } else {
      sortOptions.createdAt = -1; // По умолчанию сортируем по дате создания
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec()
    ]);

    const players = users.map(user => this.mapToPlayerResponse(user));
    const totalPages = Math.ceil(total / limit);

    return {
      players,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findPlayerById(id: string): Promise<PlayerResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Неверный формат ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    return this.mapToPlayerResponse(user);
  }

  async findPlayerByUsername(username: string): Promise<PlayerResponseDto> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    return this.mapToPlayerResponse(user);
  }

  async findPlayerByEmail(email: string): Promise<PlayerResponseDto> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    return this.mapToPlayerResponse(user);
  }

  async updatePlayer(id: string, updatePlayerDto: UpdatePlayerDto): Promise<PlayerResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Неверный формат ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    // Проверяем уникальность username и email если они изменяются
    if (updatePlayerDto.username && updatePlayerDto.username !== user.username) {
      const existingUser = await this.userModel.findOne({ username: updatePlayerDto.username });
      if (existingUser) {
        throw new ConflictException('Username уже используется');
      }
    }

    if (updatePlayerDto.email && updatePlayerDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({ email: updatePlayerDto.email });
      if (existingUser) {
        throw new ConflictException('Email уже используется');
      }
    }

    // Хешируем пароль если он изменяется
    if (updatePlayerDto.password) {
      const saltRounds = 10;
      updatePlayerDto.password = await bcrypt.hash(updatePlayerDto.password, saltRounds);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { ...updatePlayerDto, updatedAt: new Date() },
      { new: true }
    );

    return this.mapToPlayerResponse(updatedUser);
  }

  async deletePlayer(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Неверный формат ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    await this.userModel.findByIdAndDelete(id);
  }

  async getPlayerStats(id: string): Promise<PlayerStatsDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Неверный формат ID');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    // TODO: Реализовать подсчет статистики из игр
    // Пока возвращаем базовую статистику из полей пользователя
    const stats: PlayerStatsDto = {
      id: user.id,
      username: user.username,
      totalGames: user.totalGames,
      wins: user.wins,
      losses: user.losses,
      winRate: user.winRate,
      rating: user.rating,
      averageOpponentRating: 1000, // TODO: Реализовать подсчет
      bestRating: user.rating, // TODO: Реализовать отслеживание лучшего рейтинга
      gamesLast30Days: 0, // TODO: Реализовать подсчет игр за последние 30 дней
    };

    return stats;
  }

  async confirmEmail(token: string): Promise<void> {
    const user = await this.userModel.findOne({ 
      emailConfirmationToken: token,
      emailConfirmationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      throw new BadRequestException('Неверный или просроченный токен');
    }

    user.isEmailConfirmed = true;
    user.emailConfirmationToken = undefined;
    user.emailConfirmationExpires = undefined;
    await user.save();
  }

  async generateEmailConfirmationToken(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Токен действителен 24 часа

    user.emailConfirmationToken = token;
    user.emailConfirmationExpires = expiresAt;
    await user.save();

    return token;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { 
      lastLoginAt: new Date() 
    });
  }

  async updatePlayerStats(
    id: string, 
    isWin: boolean, 
    opponentRating: number,
    ratingChange: number
  ): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    const updateData: any = {
      totalGames: user.totalGames + 1,
      rating: Math.max(0, user.rating + ratingChange), // Рейтинг не может быть отрицательным
    };

    if (isWin) {
      updateData.wins = user.wins + 1;
    } else {
      updateData.losses = user.losses + 1;
    }

    await this.userModel.findByIdAndUpdate(id, updateData);
  }

  async getTopPlayers(limit: number = 10): Promise<PlayerResponseDto[]> {
    const users = await this.userModel
      .find({ isActive: true })
      .sort({ rating: -1, totalGames: -1 })
      .limit(limit)
      .exec();

    return users.map(user => this.mapToPlayerResponse(user));
  }

  async searchPlayers(query: string, limit: number = 10): Promise<PlayerResponseDto[]> {
    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ],
        isActive: true
      })
      .limit(limit)
      .exec();

    return users.map(user => this.mapToPlayerResponse(user));
  }

  private mapToPlayerResponse(user: UserDocument): PlayerResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      isEmailConfirmed: user.isEmailConfirmed,
      isActive: user.isActive,
      rating: user.rating,
      totalGames: user.totalGames,
      wins: user.wins,
      losses: user.losses,
      winRate: user.winRate,
      bio: user.bio,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    };
  }
}
