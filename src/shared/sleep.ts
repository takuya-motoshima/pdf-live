/**
  * Sleep for specified seconds.
  */
export default async (seconds: number): Promise<void> => {
  return new Promise(rslv => setTimeout(rslv, seconds * 1000));
}