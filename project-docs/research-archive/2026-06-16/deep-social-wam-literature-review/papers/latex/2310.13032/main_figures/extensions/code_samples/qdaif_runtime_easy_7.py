def sort_array(array):
    # Create a copy of array
    array_copy = array[:]

    # Determine the length of the array
    n = len(array_copy)
    
    # check the sum of first and last elements, is it even or odd
    order = (array_copy[0] + array_copy[-1]) % 2 if n else 0

    # Use insertion sort to sort array
    for i in range(1, n):
        key = array_copy[i]
        j = i - 1
        while j >= 0:
            # compare array[j] and key according to the 'order'
            condition = (array_copy[j] > key) if order else (array_copy[j] < key)
            if condition:
                array_copy[j+1] = array_copy[j]
                j -= 1
            else:
                break
        array_copy[j+1] = key

    return array_copy