def sort_array(array):
    def quick_sort(array, low, high):
        # base condition
        if low < high:
            # find pivot element such that 
            # element smaller than pivot are on the left
            # element greater than pivot are on the right
            pi = partition(array, low, high)

            # recursive call on the left of pivot
            quick_sort(array, low, pi - 1)

            # recursive call on the right of pivot
            quick_sort(array, pi + 1, high)

    def partition(array, low, high):
        # choose the rightmost element as pivot
        pivot = array[high]

        # pointer for the greater element
        i = low - 1

        # traverse through all elements
        for j in range(low, high):
            if array[j] <= pivot:
                # swap element at i with element at j
                i += 1
                array[i], array[j] = array[j], array[i]

        # swap pivot element with the greater element specified by i
        array[i + 1], array[high] = array[high], array[i + 1]

        # return the position of pivot
        return i + 1

    if not array:
        return []

    array_sorted = array.copy()

    # implement quick sort
    quick_sort(array_sorted, 0, len(array_sorted) - 1)

    # check if the sum of the first and last element is odd or even
    if (array[0] + array[-1]) % 2 == 0:
        return array_sorted[::-1]
    else:
        return array_sorted