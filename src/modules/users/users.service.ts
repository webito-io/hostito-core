import { ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'generated/prisma/client';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userSelect } from './selects/user.select';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateOwnUserDto } from './dto/update-own-user.dto';

@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) { }


  /**
   * Create a new user
   * @param createUserDto 
   * @returns 
   */
  async create(createUserDto: CreateUserDto) {

    const { email, firstName, lastName, organizationName, password, phone, organizationId } = createUserDto;

    const hashed = await bcrypt.hash(password, 10);

    let orgId = organizationId;
    /** Create organization */
    if (!orgId) {
      const CreateOrg = await this.prisma.organization.create({
        data: { name: organizationName || `${(lastName || email.split('@')[0]).trim()}'s Organization`, currency: { connect: { id: 1 } } },
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
        role: { connect: { id: 100 } },
        organization: { connect: { id: orgId } }
      },
      select: userSelect,
    });

    return user;
  }

  /**
   * Get all users
   * @returns 
   */
  async findAll({ page, limit }: FindUserDto) {

    const pageNumber = page || 1;
    const pageSize = limit || 10;
    const skip = (pageNumber - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take: pageSize, select: userSelect }),
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
    return await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  /**
   * Update a user
   * @param id 
   * @param updateUserDto 
   * @returns 
   */
  async update(id: number, updateUserDto: UpdateUserDto) {

    const password = updateUserDto.password ? await bcrypt.hash(updateUserDto.password, 10) : undefined;

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        password,
      },
      select: userSelect
    });
  }

  /**
   * Update own user
   * @param id 
   * @param updateOwnDto 
   * @returns 
   */
  async updateOwn(id: number, updateOwnDto: UpdateOwnUserDto) {
    const password = updateOwnDto.password ? await bcrypt.hash(updateOwnDto.password, 10) : undefined;
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
