/**
  * Sleep for specified seconds.
  *
  * @param    {number} seconds
  * @returns  {Promise<void>}
  */
export default async (seconds: number): Promise<void> => {
  return new Promise(rslv => setTimeout(rslv, seconds * 1000));
}