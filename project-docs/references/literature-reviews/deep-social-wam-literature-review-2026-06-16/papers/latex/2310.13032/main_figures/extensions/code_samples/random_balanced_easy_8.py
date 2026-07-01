def sort_array(array):
    # Copy the array so as not to modify the original
    array_copy = array.copy()
    
    # If the array is empty or has only one element, return it as is
    if len(array_copy) in (0, 1):
        return array_copy

    # Check the sum condition and sort accordingly
    if (array_copy[0] + array_copy[-1]) % 2 == 0:  # if sum is even
        # Use bubble sort in descending order
        for i in range(len(array_copy)):
            for j in range(len(array_copy) - 1):
                if array_copy[j] < array_copy[j + 1]:
                    array_copy[j], array_copy[j + 1] = array_copy[j + 1], array_copy[j]  # swap
    else:  # if sum is odd
        # Use bubble sort in ascending order
        for i in range(len(array_copy)):
            for j in range(len(array_copy) - 1):
                if array_copy[j] > array_copy[j + 1]:
                    array_copy[j], array_copy[j + 1] = array_copy[j + 1], array_copy[j]  # swap
                    
    return array_copy