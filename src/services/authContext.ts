import React from 'react';

const AuthContext = React.createContext<Record<string, any> | undefined>(undefined);

export default AuthContext;
