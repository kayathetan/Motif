/** The purple / orange gradient wash behind the top of every page. */
export default function Mesh({ tall = false }) {
  return <div className={tall ? 'mesh tall' : 'mesh'} />
}
