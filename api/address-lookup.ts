import { addressLookupHandler } from '../src/server/corridorService';

export default async function handler(req: any, res: any) {
  return addressLookupHandler(req, res);
}
