function LinkedList (xs)
{
  let first = cur = {};
  for (const x of xs) cur = cur.next = { value: x };
  return first.next || first;
}

export { LinkedList };
