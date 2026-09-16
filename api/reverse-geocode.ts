import { reverseGeocodeHandler } from '../src/server/corridorService';

export default async function handler(req: any, res: any) {
  return reverseGeocodeHandler(req, res);
}
