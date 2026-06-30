def sort_array(array):
    if not array:
        return []

    def custom_sort(array):
        # Implementing bubble sort
        n = len(array)
        for i in range(n):
            for j in range(0, n-i-1):
                if array[j] > array[j+1]:
                    array[j], array[j+1] = array[j+1], array[j]

    # Create a copy of the array
    array_sorted = array.copy()

    # Check the sum of the first and last element
    if (array[0] + array[-1]) % 2 == 0:
        custom_sort(array_sorted)
        return array_sorted[::-1]  # Reverse for descending order
    else:
        custom_sort(array_sorted)
        return array_sorted