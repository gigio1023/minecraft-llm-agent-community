def sort_array(array):
    # Base cases: if the list is empty or only has one element, return the list as it is.
    if len(array) <= 1:
        return array
    # Recursive function to perform the Bubble Sort method
    def bubble_sort(lst, compare):
        swapped = True
        while swapped:
            swapped = False
            for i in range(len(lst) - 1):
                if compare(lst[i], lst[i + 1]):
                    lst[i], lst[i + 1] = lst[i + 1], lst[i]
                    swapped = True
        return lst
    # Decide the comparison method depending on the sum of the first and last elements of the list
    compare = (lambda x, y: x > y) if (array[0] + array[-1]) % 2 else (lambda x, y: x < y)
    return bubble_sort(array.copy(), compare)