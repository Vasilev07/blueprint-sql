export interface BaseMapper<Entity, DTO> {
    entityToDTO(entity: Entity): DTO;
    dtoToEntity(dto: DTO): Entity;
}
