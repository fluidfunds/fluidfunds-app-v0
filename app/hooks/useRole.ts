/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'

export const useRole = () => {
  // Always return 'manager' regardless of user state
  return 'manager'
}