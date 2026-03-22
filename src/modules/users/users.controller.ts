import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnUserDto } from './dto/update-own-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('users', 'create', 'all')
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserEntity,
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('users', 'read', 'all')
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Return all users',
    type: [UserEntity],
  })
  async findAll(@Query() query: PaginationDto) {
    return await this.usersService.findAll(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('users', 'read', 'all')
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single user',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('users', 'update', 'own')
  @Patch('/me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserEntity,
  })
  async update(@Body() updateOwnUserDto: UpdateOwnUserDto, @Req() req) {
    return await this.usersService.updateOwn(req.user.id, updateOwnUserDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('users', 'update', 'all')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateOwn(id, updateUserDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('users', 'delete', 'all')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.remove(id);
  }
}
