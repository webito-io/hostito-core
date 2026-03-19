import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateOwnUserDto } from './dto/update-own-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userSelect } from './selects/user.select';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new user
   * @param createUserDto
   * @returns
   */
  async create(createUserDto: CreateUserDto) {
    const {
      email,
      firstName,
      lastName,
      organizationName,
      password,
      phone,
      organizationId,
    } = createUserDto;

    const hashed = await bcrypt.hash(password, 10);

    let orgId = organizationId;
    /** Create organization */
    if (!orgId) {
      const defaultCurrency = await this.prisma.currency.findFirst({
        where: { isDefault: true },
      });
      if (!defaultCurrency) {
        throw new NotFoundException('Default currency not found');
      }
      const CreateOrg = await this.prisma.organization.create({
        data: {
          name:
            organizationName ||
            `${(lastName || email.split('@')[0]).trim()}'s Organization`,
          currency: { connect: { id: defaultCurrency.id } },
        },
      });
      orgId = CreateOrg.id;
    }

    /* Create user */
    const user = await this.prisma.user.create({
      data: {
        email: email,
        phone: phone,
        password: hashed,
        firstName: firstName,
        lastName: lastName,
        role: { connect: { name: 'User' } },
        organization: { connect: { id: orgId } },
      },
      select: userSelect,
    });

    return user;
  }

  /**
   * Get all users
   * @returns
   */
  async findAll({ page, limit }: PaginationDto) {
    const pageNumber = page || 1;
    const pageSize = limit || 10;
    const skip = (pageNumber - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take: pageSize, select: userSelect, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);

    return { data: users, total, page: pageNumber, limit: pageSize };
  }

  /**
   * Get a user by id
   * @param id
   * @returns
   */
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  /**
   * Update a user
   * @param id
   * @param updateUserDto
   * @returns
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const password = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 10)
      : undefined;

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        password,
      },
      select: userSelect,
    });
  }

  /**
   * Update own user
   * @param id
   * @param updateOwnDto
   * @returns
   */
  async updateOwn(id: number, updateOwnDto: UpdateOwnUserDto) {
    const password = updateOwnDto.password
      ? await bcrypt.hash(updateOwnDto.password, 10)
      : undefined;
    return await this.update(id, {
      ...updateOwnDto,
      password,
    });
  }

  /**
   * Delete a user
   * @param id
   * @returns
   */
  async remove(id: number) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
