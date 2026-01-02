import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { LocationDto } from './dto';
import { mapLocationToDto } from './mappers/map-location-to-dto';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Справочник городов (MVP)',
    type: LocationDto,
    isArray: true,
  })
  getAll(): LocationDto[] {
    const locations = this.locationsService.getAll();
    return locations.map(mapLocationToDto);
  }
}
