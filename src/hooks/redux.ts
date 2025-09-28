import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);