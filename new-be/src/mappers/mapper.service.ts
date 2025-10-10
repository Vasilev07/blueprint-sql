import { Injectable } from "@nestjs/common";
import { BaseMapper } from "@mappers/base.mapper";

@Injectable()
export class MapperService {
    private mappers = new Map<string, BaseMapper<any, any>>();

    public registerMapper<Entity, DTO>(
        key: string,
        mapper: BaseMapper<Entity, DTO>,
    ): void {
        this.mappers.set(key, mapper);
    }

    public getMapper<Entity, DTO>(key: string): BaseMapper<Entity, DTO> {
        if (!this.mappers.has(key)) {
            throw new Error(`Mapper with key ${key} not found`);
        }
        return this.mappers.get(key);
    }

    entityToDTO<Entity, DTO>(key: string, entity: Entity): DTO {
        const mapper = this.getMapper<Entity, DTO>(key);
        return mapper.entityToDTO(entity);
    }

    dtoToEntity<Entity, DTO>(key: string, dto: DTO): Entity {
        const mapper = this.getMapper<Entity, DTO>(key);
        return mapper.dtoToEntity(dto);
    }
}
