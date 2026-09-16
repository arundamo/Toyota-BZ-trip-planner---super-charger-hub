import { analyzeRouteHandler } from '../src/server/corridorService';

export default async function handler(req: any, res: any) {
  return analyzeRouteHandler(req, res);
}
