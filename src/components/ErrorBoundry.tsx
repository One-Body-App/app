import React, { ReactNode, useState, useCallback, FC } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
}

function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setHasError(false);
    setErrorState(null);
  }, []);

  const errorHandler = useCallback((caughtError: Error, info?: any) => {
    setHasError(true);
    setErrorState(caughtError);
  }, []);

  if (hasError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong.</Text>
        <Text style={styles.message}>{errorState?.toString()}</Text>
        <Button title="Try Again" onPress={resetError} />
      </View>
    );
  }

  try {
    return children;
  } catch (err: any) {
    errorHandler(err);
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
