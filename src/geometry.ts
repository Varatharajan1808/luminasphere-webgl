// Nothing here - removed unused import

export interface GeometryData {
    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
    indices: Uint16Array;
}

export const GeometryUtils = {
    createIcosahedron: function (radius: number = 1, detail: number = 0): GeometryData {
        const t = (1 + Math.sqrt(5)) / 2;
        const vertices: number[][] = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
        ];

        const faces: number[][] = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];

        for (let i = 0; i < detail; i++) {
            const faces2: number[][] = [];
            for (let j = 0; j < faces.length; j++) {
                const [v1, v2, v3] = faces[j];
                const a = this.getMiddlePoint(vertices, v1, v2);
                const b = this.getMiddlePoint(vertices, v2, v3);
                const c = this.getMiddlePoint(vertices, v3, v1);
                faces2.push([v1, a, c], [v2, b, a], [v3, c, b], [a, b, c]);
            }
            faces.length = 0;
            faces.push(...faces2);
        }

        const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
        const vertexMap = new Map<string, number>();
        let index = 0;

        for (let i = 0; i < faces.length; i++) {
            const [a, b, c] = faces[i];
            const addVertex = (vertexIndex: number): number => {
                const v = vertices[vertexIndex];
                const key = v.join(',');
                if (vertexMap.has(key)) return vertexMap.get(key)!;

                const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
                const nx = v[0] / length, ny = v[1] / length, nz = v[2] / length;

                positions.push(nx * radius, ny * radius, nz * radius);
                normals.push(nx, ny, nz);
                uvs.push(
                    0.5 + Math.atan2(nz, nx) / (2 * Math.PI),
                    0.5 - Math.asin(ny) / Math.PI
                );

                vertexMap.set(key, index);
                return index++;
            };
            indices.push(addVertex(a), addVertex(b), addVertex(c));
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices: new Uint16Array(indices)
        };
    },

    getMiddlePoint: function (vertices: number[][], p1: number, p2: number): number {
        const v1 = vertices[p1], v2 = vertices[p2];
        const middle = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2, (v1[2] + v2[2]) / 2];
        vertices.push(middle);
        return vertices.length - 1;
    }
};
