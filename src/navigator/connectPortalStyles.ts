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
    backgroundColor: '#F2F3F3',
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
    paddingVertical: spacing.x10,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    marginTop: spacing.x10,
    borderRadius: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.x10,
    paddingHorizontal: spacing.x20,
    marginTop: spacing.x8,
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: spacing.x10,
    paddingHorizontal: spacing.x20,
    borderRadius: 5,
  },
  iconButton: {
    backgroundColor: 'white',
    padding: spacing.x10,
    borderRadius: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: spacing.x10,
    borderRadius: 5,
    borderWidth: 1,
  },
  listMapButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listButton: {
    marginRight: spacing.x10,
    backgroundColor: 'white',
    padding: spacing.x10,
    borderRadius: 5,
    borderWidth: 1,
  },
  mapButton: {
    backgroundColor: 'white',
    padding: spacing.x10,
    borderRadius: 5,
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: '#126B87',
  },
  organizationContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  organizationImage: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  organizationDetails: {
    flex: 1,
  },
  organizationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  organizationLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalCloseButton: {
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    marginBottom: 20,
  },
  filterItem: {
    marginBottom: 10,
  },
  filterLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  applyFilterButton: {
    backgroundColor: '#126B87',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: spacing.x104,
  },
  applyFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
