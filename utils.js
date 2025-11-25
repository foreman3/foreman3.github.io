export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 1200;

export const matterToThree = (body, mesh) => {
    const { x, y } = body.position;
    mesh.position.set(x - TABLE_WIDTH / 2, -(y - TABLE_HEIGHT / 2), 0);
    mesh.rotation.z = body.angle;
};
