import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.x20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.x10,
    textAlign: 'center',
  },
  optionContainer: {
    flexDirection: 'row',
    marginBottom: spacing.x20,
    backgroundColor: '#ccc',
    paddingVertical: spacing.x10,
    borderRadius: spacing.x5,
  },
  option: {
    flex: 1,
    alignItems: 'center',
  },
  selectedOption: {
    borderBottomWidth: 2,
    borderBottomColor: 'black',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: spacing.x13,
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    marginTop: spacing.x10,
    borderRadius: 5,
  },
});
