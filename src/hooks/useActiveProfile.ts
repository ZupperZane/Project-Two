import { useContext } from "react";
import { ActiveProfileContext } from "../contexts/ActiveProfileContext";

export function useActiveProfile() {
  return useContext(ActiveProfileContext);
}
